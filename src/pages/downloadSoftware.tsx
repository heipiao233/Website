import VersionSelectorElement from "@/components/downloadSoftware/VersionSelectorElement";
import {useRouter} from "next/router";
import {Project} from "@/interfaces/Project";
import React, {useEffect, useState} from "react";
import {Build, ProjectBuilds} from "@/interfaces/Build";
import NavigationTableElement from "@/components/downloadSoftware/NavigationTableElement";
import TableBuildElement from "@/components/downloadSoftware/TableBuildElement";
import LoadingParagraph from "@/components/downloadSoftware/LoadingParagraph";
import {capitalizeFirstLetter} from "@/util/String";
import {useAppSelector} from "@/util/redux/Hooks";
import {selectTranslations} from "@/features/i18n/TranslatorSlice";
import {getLocaleStringAsArgs} from "@/util/LocaleHelper";
import SearchElement from "@/components/downloadSoftware/SearchElement";
import BuildDetailsModal from "@/components/downloadSoftware/BuildDetailsModal";
import {CustomFlowbiteTheme, Flowbite, Toast} from "flowbite-react";
import {HiExclamation, HiFire} from "react-icons/hi";
import {useSelector} from "react-redux";
import {selectTheme} from "@/features/theme/ThemeSlice";

const customTheme: CustomFlowbiteTheme = {
    toast: {
        "root": {
            "base": "flex w-full max-w-2xl items-center rounded-lg bg-white p-4 text-gray-500 shadow dark:bg-dark-100 dark:text-gray-300",
            "closed": "opacity-0 ease-out"
        },
        "toggle": {
            "base": "-mx-1.5 -my-1.5 ml-auto inline-flex h-8 w-8 rounded-lg bg-white p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-300 dark:bg-dark-200 dark:text-gray-500 dark:hover:bg-dark-300 dark:hover:text-white",
            "icon": "h-5 w-5 shrink-0"
        }
    }
}

export default function DownloadSoftware() {
    const router = useRouter()
    const strings = useAppSelector(selectTranslations);
    const perPage = 10
    const isDark = useSelector(selectTheme)

    // React states
    const [project, setProject] = useState<Project | undefined>()
    const [originalBuildPages, setOriginalBuildPages] = useState<Build[][]>([])
    const [viewedBuildPages, setViewedBuildPages] = useState<Build[][]>([])
    const [currentPage, setCurrentPage] = useState<number>(0)
    const [selectedVersion, setSelectedVersion] = useState<string | undefined>()
    const [noResult, setNoResult] = useState<boolean>(false)
    const [noBuild, setNoBuild] = useState<boolean>(false)
    const [openModal, setOpenModal] = useState<string | undefined>();
    const [modalBuild, setModalBuild] = useState<Build | undefined>();
    const [toastMessage, setToastMessage] = useState<string | undefined>();
    const [hiColor, setHiColor] = useState<string>('orange');

    useEffect(() => {
        if (router.isReady) {
            const {project} = router.query as { project: Project }

            if (project === Project.Mohist || project === Project.Banner)
                setProject(project)
            else
                router.push('/404').catch()
        }
    }, [router.isReady, router.query])

    useEffect(() => {
        const handleVersionChanged = async () => {
            setViewedBuildPages([])
            setOriginalBuildPages([])
            setNoBuild(false)

            // Update the URL with the new version
            await router.push({
                pathname: router.pathname,
                query: {
                    ...router.query,
                    projectVersion: selectedVersion
                }
            }, undefined, {shallow: true})

            if (project === Project.Mohist) {
                switch (selectedVersion) {
                    case "1.7.10":
                        setHiColor('orange')
                        setToastMessage(strings['downloadSoftware.mohist.1.7.10.toast'])
                        break
                    case "1.18.2":
                        setHiColor('blue')
                        setToastMessage(strings['downloadSoftware.mohist.1.18.2.toast'])
                        break
                    case "1.19.2":
                        setHiColor('orange')
                        setToastMessage(strings['downloadSoftware.mohist.1.19.2.toast'])
                        break
                    case "1.19.4":
                        setHiColor('blue')
                        setToastMessage(strings['downloadSoftware.mohist.1.19.4.toast'])
                        break
                    case "1.20":
                        setHiColor('orange')
                        setToastMessage(strings['downloadSoftware.mohist.1.20.toast'])
                        break
                    case "1.20.1":
                        setHiColor('blue')
                        setToastMessage(strings['downloadSoftware.mohist.1.20.1.toast'])
                        break
                }
            }

            const projectBuildsReq = await fetch(`https://mohistmc.com/api/v2/projects/${project}/${selectedVersion}/builds`)
            const buildsJson: ProjectBuilds = await projectBuildsReq.json()

            if (!buildsJson?.builds || buildsJson?.builds?.length === 0) {
                setNoBuild(true)
                // TODO: Toast error
                return
            }

            const builds = buildsJson.builds.reverse().map((build) => {
                return {
                    ...build,
                    fileName: `${project}-${selectedVersion}-${build.number}-server.jar`
                }
            })

            const pages: Build[][] = []
            for (let i = 0; i < builds.length; i += perPage)
                pages.push(builds.slice(i, i + perPage))

            // Check if the user have changed the version while the builds were loading
            if (selectedVersion !== buildsJson.projectVersion)
                return

            setOriginalBuildPages(pages)
            setViewedBuildPages(pages)
            setCurrentPage(0)
        }

        selectedVersion && handleVersionChanged().catch()
    }, [selectedVersion])

    return (
        <section className="flex flex-col gap-6 items-center bg-gray-100 dark:bg-dark-25 pt-20 pb-20">
            <div className={`flex items-center justify-center pt-10 md:pt-0`}>
                <h1 className="text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white md:mt-10 text-center">{getLocaleStringAsArgs(strings['downloadSoftware.title'])[0]}
                    <span
                        className="text-blue-600 dark:text-blue-500">&nbsp;{capitalizeFirstLetter(project)}</span>
                    {getLocaleStringAsArgs(strings['downloadSoftware.title'])[1]}
                </h1>
            </div>
            <p className="text-lg text-center font-normal text-gray-500 lg:text-xl dark:text-gray-400 mb-3">{strings[`downloadSoftware.${project}.desc`]}</p>
            <BuildDetailsModal build={modalBuild} project={project} openModal={openModal} setOpenModal={setOpenModal}/>
            {toastMessage?.length && <Flowbite theme={{theme: customTheme, dark: isDark}}>
                <Toast>
                    <div
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-${hiColor}-100 text-${hiColor}-500 dark:bg-${hiColor}-600 dark:text-white`}>
                        <HiExclamation className="h-5 w-5"/>
                    </div>
                    <div className="ml-3 text-sm font-normal">
                        {toastMessage}
                    </div>
                    <Toast.Toggle/>
                </Toast>
            </Flowbite>}
            <div
                className="relative shadow-md dark:shadow-md dark:bg-dark-50 bg-white sm:rounded-lg mt-3 p-5">
                <div className={`flex md:justify-between gap-2 justify-center items-center pb-4 flex-wrap`}>
                    <SearchElement originalBuildPages={originalBuildPages} setViewedBuildPages={setViewedBuildPages}
                                   setCurrentPage={setCurrentPage} setNoResult={setNoResult} perPage={perPage}
                                   strings={strings} project={project} router={router}/>
                    <VersionSelectorElement selectedVersion={selectedVersion} setSelectedVersion={setSelectedVersion}
                                            software={project} router={router}/>
                </div>
                <table
                    className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-separate border-spacing-0 rounded-lg overflow-hidden">
                    <thead
                        className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-200 dark:text-gray-300 rounded-xl">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            {strings['downloadSoftware.build.name']}
                        </th>
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">
                            <div className="flex items-center">
                                {strings['downloadSoftware.build.md5']}
                            </div>
                        </th>
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">
                            <div className="flex items-center">
                                {strings['downloadSoftware.build.date']}
                            </div>
                        </th>
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">
                            <div className="flex items-center">
                                {project === Project.Mohist ? strings['downloadSoftware.build.forgever'] : project === Project.Banner ? strings['downloadSoftware.build.fabricver'] : "N/A"}
                            </div>
                        </th>
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">
                            <span className="sr-only">{strings['button.download']}</span>
                        </th>
                        <th scope="col" className="px-6 py-3">
                            <span className="sr-only">{strings['social.github']}</span>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {viewedBuildPages.length > 0 &&
                        viewedBuildPages[currentPage].map((build, index) => TableBuildElement({
                                build,
                                isLatest: build === originalBuildPages[0][0],
                                project: project as Project,
                                indexOnPage: index,
                                strings,
                                setOpenModal,
                                setModalBuild
                            }
                        ))
                    }
                    </tbody>
                </table>
                {viewedBuildPages.length === 0 && !noResult && !noBuild &&
                    <div className="flex justify-center mt-4">
                        <LoadingParagraph/>
                    </div>
                }
                {noResult &&
                    <div className="flex justify-center mt-4">
                        <p className="text-gray-500 dark:text-gray-400">{strings['downloadSoftware.search.noresults']}</p>
                    </div>
                }
                {noBuild &&
                    <div className="flex justify-center mt-4">
                        <p className="text-gray-500 dark:text-gray-400">{strings['downloadSoftware.search.nobuilds']}</p>
                    </div>
                }
                <NavigationTableElement buildPages={viewedBuildPages} currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}/>
            </div>

        </section>
    )
}